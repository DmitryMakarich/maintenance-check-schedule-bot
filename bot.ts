import { Bot } from "grammy";
import { CronJob } from 'cron';
import 'dotenv/config';

const { TG_KEY, SCHEDULE, CHAT_ID, BOT_NAME } = process.env;

class MaintenanceCheckNotificationCronJob {
  private runOnStart = false;
  private bot = new Bot(TG_KEY as string);
  constructor() {
    const job = new CronJob(
      SCHEDULE as string,
      () => this.sendNotification(),
      null,
      undefined,
      'UTC',
      undefined,
      this.runOnStart,
    );

    this.bot.start();

    this.bot.on('message:text', ctx => {
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


  private async sendNotification() {
    console.info('Sending notification...');
    await this.bot.api.sendMessage(CHAT_ID as string, 'message');
  }

}

new MaintenanceCheckNotificationCronJob();
