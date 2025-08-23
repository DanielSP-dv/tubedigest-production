import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobsService } from './jobs.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JobsSchedulerService {
  constructor(
    private readonly jobsService: JobsService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async scheduleDailyDigests() {
    console.log('Daily digest scheduling starting at 9 AM');
    
    try {
      // Get all users who have selected channels
      const users = await this.prisma.user.findMany({
        where: {
          channelSubs: {
            some: {},
          },
        },
        select: {
          email: true,
        },
      });

      console.log(`Found ${users.length} users to schedule digests for`);

      // Schedule digest jobs for each user
      for (const user of users) {
        await this.jobsService.scheduleDigestForUser(user.email);
        console.log(`Scheduled digest for user: ${user.email}`);
      }

      console.log('Daily digest scheduling completed successfully');
    } catch (error) {
      console.error('Failed to schedule daily digests:', error);
    }
  }
}
