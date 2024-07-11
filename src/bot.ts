import { Bot } from "grammy";
import { CronJob } from 'cron';
import 'dotenv/config';
import { DAY_OF_WEEK, getWeeksBetween } from './weeks.helper';

const { TG_KEY, SCHEDULE, CHAT_ID, BOT_NAME, KSENIA_USERNAME, DIMA_USERNAME, IGOR_USERNAME, STAS_USERNAME } = process.env;

class MaintenanceCheckNotificationCronJob {
  // Anchor data for sprint calculations
  private anchorDate = new Date('2024-07-11');
  private anchorSprint = 69;
  private runOnStart = true;
  private bot = new Bot(TG_KEY as string);
  // %2 + 1
  private oddSprintSchedule: SprintSchedule = { 
    1: IGOR_USERNAME as string,
    2: KSENIA_USERNAME as string,
    3: STAS_USERNAME as string,
    4: DIMA_USERNAME as string,
  }; 
  // %2
  private evenSprintSchedule: SprintSchedule = { 
    1: KSENIA_USERNAME as string,
    2: IGOR_USERNAME as string,
    3: DIMA_USERNAME as string,
    4: STAS_USERNAME as string,
  }; 
  constructor() {
    const job = new CronJob(
      SCHEDULE as string,
      () => this.notifyIfScheduled(),
      null,
      undefined,
      'UTC',
      undefined,
      this.runOnStart,
    );

    this.bot.start();

    this.bot.on('message:text', ctx => {
      console.info(ctx.chat.id);
      if (ctx.message.text.includes(BOT_NAME as string))
        ctx.react("❤");
      // ctx.reply('test');
    })
    
    job.start();
    console.info(`Cron job status: ${job.running}`);

    if (!job.running) {
      const msg = 'the process is stopped, please check cron jobs and restart the server';
      console.error(msg);
      process.exit(1);
    }
  }

  private async notifyIfScheduled() {
    const currentDate = new Date();
    // const currentDate = new Date('2024-08-15');
    const result = this.getMaintenanceDayAndCheckerUsername(currentDate);
    if (!result) return;
    const { check, checker } = result;
    
    const message = this.getMessage(checker, check);
    await this.sendNotification(message);
  }


  private async sendNotification(message: string) {
    console.info('Sending notification...');
    await this.bot.api.sendMessage(CHAT_ID as string, message);
  }

  /* 
  *  A sprint starts on Thursday, The first (1) check is on the next day, on Friday.
  *  The second (2) check is on Monday on the next week.
  *  The third (3) check is on Thursday on the same week.
  *  The last (4) check is on Monday on the next week.
  *  Method returns -1 if no check is scheduled
  * 
  *  Example:  
  *  Sprint 69 started on July 11th.
  *  1st check: July 12th, Friday
  *  2nd check: July 15th, Monday
  *  3rd check: July 18th, Thursday
  *  4th check: July 22th, Monday
  */
  private whatMaintenanceCheckIsScheduled(date: Date, weekDifference: number): -1 | MaintenanceCheckDay {
    const isFirstWeekOfSprint = !(weekDifference % 2);
    const dayOfWeek = date.getDay();

    if (isFirstWeekOfSprint)  {
      if (dayOfWeek === DAY_OF_WEEK.FRIDAY) return 1;
      if (dayOfWeek === DAY_OF_WEEK.MONDAY) return 2;
      return -1;
    }
    if (dayOfWeek === DAY_OF_WEEK.THURSDAY) return 3;
    if (dayOfWeek === DAY_OF_WEEK.MONDAY) return 4;
    return -1;
  }

  private getMaintenanceDayAndCheckerUsername(date: Date): { check: MaintenanceCheckDay, checker: string } | undefined {
    const weekDifference = getWeeksBetween(this.anchorDate, date);
    const currentSprint = this.anchorSprint + Math.floor(weekDifference / 2);

    const check = this.whatMaintenanceCheckIsScheduled(date, weekDifference);
    console.info(`date: ${date.toISOString()}, anchor: ${this.anchorDate.toISOString()}`);
    console.info(`weekDifference: ${weekDifference}`);
    console.info(`Current sprint: ${currentSprint}, check day: ${check}`);
    if (check === -1) return;

    if (currentSprint % 2) return { check, checker: this.oddSprintSchedule[check] };
    return { check, checker: this.evenSprintSchedule[check] };
  }

  private getMessage(username: string, check: MaintenanceCheckDay): string {
    const basicCheck = 'resources, queues';
    const fullCheck = `${basicCheck} and logs`;

    const areasToCheck = check % 2 ? fullCheck : basicCheck;

    return `🤖 Today's maintenance check is on @${username}. Areas to check: ${areasToCheck}`;
  }
}

new MaintenanceCheckNotificationCronJob();

type MaintenanceCheckDay = 1 | 2 | 3 | 4 ;
type SprintSchedule = Record<MaintenanceCheckDay, string>;
