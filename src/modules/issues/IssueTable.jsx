import IssueRow from "./IssueRow";

export default function IssueTable({ issues, onStatusChange }) {
  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Issue</th>
          <th>Module</th>
          <th>Status</th>
          <th>Assignee</th>
          <th>Opened By</th>
          <th>Finished At</th>
          <th>Priority</th>
          <th>Verified</th>
        </tr>
      </thead>

      <tbody>
        {issues.map(issue => (
          <IssueRow
            key={issue.id}
            issue={issue}
            onStatusChange={onStatusChange}
          />
        ))}
      </tbody>
    </table>
  );
}


