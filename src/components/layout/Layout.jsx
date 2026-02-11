import Header from "./Header";
import Sidebar from "./Sidebar";

export default function Layout({ children, onLogout }) {
  return (
    <>
      <Header onLogout={onLogout} />
      <div className="layout">
        <Sidebar />
        <div className="content">{children}</div>
      </div>
    </>
  );
}
