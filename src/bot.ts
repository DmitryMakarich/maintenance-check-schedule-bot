import { Bot } from "grammy";
import { CronJob } from "cron";
import "dotenv/config";
import { DAY_OF_WEEK, getWeeksBetween } from "./weeks.helper";

const {
  TG_KEY,
  SCHEDULE,
  CHAT_ID,
  BOT_NAME,
  DIMA_USERNAME,
  IGOR_USERNAME,
  GRISHA_USERNAME,
  ANDREY_USERNAME,
  TEST_DATE,
} = process.env;

class MaintenanceCheckNotificationCronJob {
  // Anchor data for sprint calculations
  private anchorDate = new Date("2024-07-11");
  private anchorSprint = 69;
  private runOnStart = false;
  private bot = new Bot(TG_KEY as string);
  // Sprint rotation: 4 developers, 4 checks per sprint
  private firstSprintSchedule: SprintSchedule = {
    1: DIMA_USERNAME as string,
    2: IGOR_USERNAME as string,
    3: GRISHA_USERNAME as string,
    4: ANDREY_USERNAME as string,
  };
  private secondSprintSchedule: SprintSchedule = {
    1: IGOR_USERNAME as string,
    2: GRISHA_USERNAME as string,
    3: ANDREY_USERNAME as string,
    4: DIMA_USERNAME as string,
  };
  private thirdSprintSchedule: SprintSchedule = {
    1: GRISHA_USERNAME as string,
    2: ANDREY_USERNAME as string,
    3: DIMA_USERNAME as string,
    4: IGOR_USERNAME as string,
  };
  private fourthSprintSchedule: SprintSchedule = {
    1: ANDREY_USERNAME as string,
    2: DIMA_USERNAME as string,
    3: IGOR_USERNAME as string,
    4: GRISHA_USERNAME as string,
  };
  constructor() {
    const job = new CronJob(
      SCHEDULE as string,
      () => this.notifyIfScheduled(),
      null,
      undefined,
      "UTC",
      undefined,
      this.runOnStart
    );

    console.info('test')

    this.bot.start();

    this.bot.on('message:text', ctx => {
      console.info(ctx.chat.id);
      console.info(ctx.message.text); 
      console.info(BOT_NAME as string);
      console.info(CHAT_ID as string);

      if (ctx.message.text.includes(BOT_NAME as string)) {
        console.info('included')
        ctx.react("❤");
      }

      // ctx.reply('test');
    })

    job.start();
    console.info(`Cron job status: ${job.running}`);

    if (!job.running) {
      const msg =
        "the process is stopped, please check cron jobs and restart the server";
      console.error(msg);
      process.exit(1);
    }
  }

  private async notifyIfScheduled() {
    const currentDate = TEST_DATE ? new Date(TEST_DATE) : new Date();
    // const currentDate = new Date('2024-08-15');
    const result = this.getMaintenanceDayAndCheckerUsername(currentDate);
    if (!result) return;
    const { check, checker } = result;

    const message = this.getMessage(checker, check);
    await this.sendNotification(message);
  }

  private async sendNotification(message: string) {
    console.info("Sending notification...");
    await this.bot.api.sendMessage(CHAT_ID as string, message);
  }

  /*
   *  A sprint is 3 weeks long and starts on Thursday.
   *  The first (1) check is on the next day, on Friday (week 1).
   *  The second (2) check is on Tuesday on the next week (week 2).
   *  The third (3) check is on Thursday on the next week (week 2).
   *  The fourth (4) check is on Monday on the next week (week 3).
   *  Method returns -1 if no check is scheduled
   *
   *  Example:
   *  Sprint starts on Thursday, April 2nd.
   *  1st check: April 4th, Friday (week 1)
   *  2nd check: April 8th, Tuesday (week 2)
   *  3rd check: April 10th, Thursday (week 2)
   *  4th check: April 14th, Monday (week 3)
   */
  private whatMaintenanceCheckIsScheduled(
    date: Date,
    weekDifference: number
  ): -1 | MaintenanceCheckDay {
    const weekInSprint = weekDifference % 3;
    const dayOfWeek = date.getDay();

    // Week 1 of sprint
    if (weekInSprint === 0) {
      if (dayOfWeek === DAY_OF_WEEK.FRIDAY) return 1;
      return -1;
    }
    
    // Week 2 of sprint
    if (weekInSprint === 1) {
      if (dayOfWeek === DAY_OF_WEEK.TUESDAY) return 2;
      if (dayOfWeek === DAY_OF_WEEK.THURSDAY) return 3;
      return -1;
    }
    
    // Week 3 of sprint
    if (weekInSprint === 2) {
      if (dayOfWeek === DAY_OF_WEEK.MONDAY) return 4;
      return -1;
    }
    
    return -1;
  }

  private getMaintenanceDayAndCheckerUsername(
    date: Date
  ): { check: MaintenanceCheckDay; checker: string } | undefined {
    const weekDifference = getWeeksBetween(this.anchorDate, date);
    const currentSprint = this.anchorSprint + Math.floor(weekDifference / 3);

    const check = this.whatMaintenanceCheckIsScheduled(date, weekDifference);
    console.info(
      `date: ${date.toISOString()}, anchor: ${this.anchorDate.toISOString()}`
    );
    console.info(`weekDifference: ${weekDifference}`);
    console.info(`Current sprint: ${currentSprint}, check day: ${check}`);
    if (check === -1) return;

    switch (currentSprint % 4) {
      case 0:
        return { check, checker: this.fourthSprintSchedule[check] };
      case 1:
        return { check, checker: this.firstSprintSchedule[check] };
      case 2:
        return { check, checker: this.secondSprintSchedule[check] };
      case 3:
        return { check, checker: this.thirdSprintSchedule[check] };
    }
  }

  private getMessage(username: string, check: MaintenanceCheckDay): string {
    const basicCheck = "resources, queues";
    const fullCheck = `${basicCheck} and logs`;

    const areasToCheck = check === 2 ? fullCheck : basicCheck;

    return `🤖 Today's maintenance check is on ${username}. Areas to check: ${areasToCheck}`;
  }
}

new MaintenanceCheckNotificationCronJob();

type MaintenanceCheckDay = 1 | 2 | 3 | 4;
type SprintSchedule = Record<MaintenanceCheckDay, string>;
