export const getWeeksBetween = (start: Date, end: Date): number => {
  // Calculate the difference in milliseconds between dt2 and dt1
  let diff = (end.getTime() - start.getTime()) / 1000;
  // Convert the difference from milliseconds to weeks by dividing it by the number of milliseconds in a week
  diff /= (60 * 60 * 24 * 7);
  // Return the absolute value of the rounded difference as the result
  return Math.abs(Math.floor(diff));
} 

export enum DAY_OF_WEEK {
  SUNDAY,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
}