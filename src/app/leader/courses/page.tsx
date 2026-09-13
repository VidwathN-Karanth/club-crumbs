// Leaders get the same Courses tracker as members — it reads and writes the
// signed-in account's own synced workspace, so re-exporting the member page is
// all that is needed.
export { default } from '../../dashboard/courses/page';
