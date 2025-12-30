import IssueHeader from "./IssueHeader";
import IssueTable from "./IssueTable";
import useIssues from "../../hooks/useIssues";

export default function IssuePage({ currentUser }) {
  const { issues, addIssue, updateStatus } = useIssues();

  return (
    <>
      <IssueHeader onAddIssue={(title) => addIssue(title, currentUser)} />
      <IssueTable
        issues={issues}
        onStatusChange={(id, status) =>
          updateStatus(id, status, currentUser)
        }
      />
    </>
  );
}
