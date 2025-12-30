import { useState } from "react";

export default function IssueHeader({ onAddIssue }) {
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    onAddIssue(title);
    setTitle("");
  };

  return (
    <div className="issue-header">
      <h2>Issues</h2>

      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Issue title (type only this)"
      />

      <button onClick={handleSubmit}>Submit Issue</button>
    </div>
  );
}
