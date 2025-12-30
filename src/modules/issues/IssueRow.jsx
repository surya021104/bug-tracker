import Status from "../../components/common/Status";
import { ISSUE_TEMPLATES } from "../../data/issueTemplates";

export default function IssueRow({ issue, onStatusChange }) {
  const template = ISSUE_TEMPLATES[issue.issueType];

  return (
    <>
      <tr>
        <td>{issue.id}</td>
        <td>{issue.title}</td>
        <td>{issue.module}</td>

        <td>
          <Status
            value={issue.status}
            onChange={status => onStatusChange(issue.id, status)}
          />
        </td>

        <td>{issue.assignee}</td>
        <td>{issue.openedBy}</td>
        <td>{issue.resolvedAt || "—"}</td>
        <td><span className="badge high">High</span></td>
        <td><span className="badge unverified">Unverified</span></td>
      </tr>

      <tr>
        <td colSpan="9">
          <div className="details">
            <p><b>Description:</b> {template?.description || "—"}</p>
            <p><b>Steps:</b> {template?.steps || "—"}</p>
            <p><b>Expected:</b> {template?.expected || "—"}</p>
            <p><b>Actual:</b> {template?.actual || "—"}</p>
            <p><b>Resolved At:</b> {issue.resolvedAt || "—"}</p>
          </div>
        </td>
      </tr>
    </>
  );
}

