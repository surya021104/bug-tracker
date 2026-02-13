import { applications } from "../../data/applications";
import useIssues from "../../hooks/useIssues"; // IMPORT HOOK

export default function ApplicationsPage() {
  const { loadIssues } = useIssues(); // CALL HOOK

  const analyzeApp = async (url) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/analyze?url=${encodeURIComponent(url)}`
      );

      const data = await res.json();

      // REFRESH DASHBOARD AFTER ANALYSIS
      loadIssues();

      alert(
        `Analysis complete\n` +
        `New bugs: ${data.bugsCreated}\n` +
        `Duplicates skipped: ${data.bugsSkipped}`
      );

    } catch (err) {
      console.error(err);
      alert("Analysis failed");
    }
  };

  return (
    <div>
      <h2>Applications</h2>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>URL</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {applications.map(app => (
            <tr key={app.id}>
              <td>{app.name}</td>

              <td>
                <a href={app.url} target="_blank" rel="noreferrer">
                  {app.url}
                </a>
              </td>

              <td>
                <button onClick={() => analyzeApp(app.url)}>
                  Analyze App
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
