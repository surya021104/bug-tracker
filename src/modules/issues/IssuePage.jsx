import IssueHeader from "./IssueHeader";
import IssueTable from "./IssueTable";
import useIssues from "../../hooks/useIssues";

export default function IssuePage() {
  const { issues, addIssue, updateStatus } = useIssues();

  return (
    <>
      <IssueHeader onAddIssue={addIssue} />
      <IssueTable issues={issues} onStatusChange={updateStatus} />
    </>
  );
}
