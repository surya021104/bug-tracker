import Layout from "./components/layout/Layout";
import IssuePage from "./modules/issues/IssuePage";
import "./styles/global.css";

export default function App() {
  return (
    <Layout>
      <IssuePage />
    </Layout>
  );
}
