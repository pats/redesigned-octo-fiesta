import styles from "./page.module.css";
import TcStringDisplay from "@/components/TcStringDisplay";
import TcStringDecoder from "@/components/TcStringDecoder";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.heading}>CMP Demo — TCF v2.3</h1>
        <TcStringDisplay />
        <TcStringDecoder />
      </main>
    </div>
  );
}
