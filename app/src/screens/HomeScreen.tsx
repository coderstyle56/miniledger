import { useCallback, useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator,
} from "react-native";
import { api } from "../api";
import { Loan, Summary } from "../types";
import AddLoanForm from "./AddLoanForm";

type Props = { token: string; onLogout: () => void };

const rupees = (n: number | string) =>
  "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function HomeScreen({ token, onLogout }: Props) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const [loansData, summaryData] = await Promise.all([
        api<Loan[]>("/loans", { token }),
        api<Summary>("/summary", { token }),
      ]);
      setLoans(loansData);
      setSummary(summaryData);
      setError("");
    } catch (e: any) {
      if (e.message.toLowerCase().includes("token")) return onLogout();
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  async function markRepaid(id: number) {
    try {
      await api(`/loans/${id}/repay`, { method: "PATCH", token });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (showForm) {
    return (
      <AddLoanForm
        token={token}
        onCancel={() => setShowForm(false)}
        onDone={() => { setShowForm(false); load(); }}
      />
    );
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MiniLedger</Text>
        <TouchableOpacity onPress={onLogout}><Text style={styles.link}>Logout</Text></TouchableOpacity>
      </View>

      {summary && (
        <View style={styles.card}>
          <View style={styles.cardCol}>
            <Text style={styles.cardLabel}>Lent</Text>
            <Text style={styles.cardValue}>{rupees(summary.total_lent)}</Text>
          </View>
          <View style={styles.cardCol}>
            <Text style={styles.cardLabel}>Repaid</Text>
            <Text style={[styles.cardValue, { color: "#16a34a" }]}>{rupees(summary.total_repaid)}</Text>
          </View>
          <View style={styles.cardCol}>
            <Text style={styles.cardLabel}>Overdue</Text>
            <Text style={[styles.cardValue, { color: "#dc2626" }]}>{rupees(summary.overdue_amount)}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
        <Text style={styles.addButtonText}>+ Add Entry</Text>
      </TouchableOpacity>

      {error !== "" && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={loans}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
        ListEmptyComponent={<Text style={styles.empty}>No entries yet. Add one!</Text>}
        renderItem={({ item }) => (
          <View style={[styles.item, item.is_overdue && styles.itemOverdue, item.is_repaid && styles.itemRepaid]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.friend_name}</Text>
              <Text style={styles.itemSub}>Due {item.due_date}</Text>
              {item.is_overdue && <Text style={styles.overdueBadge}>OVERDUE</Text>}
              {item.is_repaid && <Text style={styles.repaidBadge}>REPAID</Text>}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.itemAmount}>{rupees(item.amount)}</Text>
              {!item.is_repaid && (
                <TouchableOpacity style={styles.repayButton} onPress={() => markRepaid(item.id)}>
                  <Text style={styles.repayText}>Mark repaid</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 16, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "bold" },
  link: { color: "#2563eb", fontSize: 16 },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardCol: { flex: 1, alignItems: "center" },
  cardLabel: { color: "#666", fontSize: 13 },
  cardValue: { fontSize: 18, fontWeight: "bold", marginTop: 4 },
  addButton: { backgroundColor: "#2563eb", padding: 12, borderRadius: 8, alignItems: "center", marginBottom: 12 },
  addButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  error: { color: "#dc2626", marginBottom: 8 },
  empty: { textAlign: "center", color: "#888", marginTop: 40 },
  item: { flexDirection: "row", backgroundColor: "#fff", padding: 14, borderRadius: 10, marginBottom: 8 },
  itemOverdue: { backgroundColor: "#fee2e2", borderLeftWidth: 5, borderLeftColor: "#dc2626" },
  itemRepaid: { opacity: 0.55 },
  itemName: { fontSize: 17, fontWeight: "600" },
  itemSub: { color: "#666", marginTop: 2 },
  itemAmount: { fontSize: 17, fontWeight: "bold" },
  overdueBadge: { color: "#dc2626", fontWeight: "bold", fontSize: 12, marginTop: 4 },
  repaidBadge: { color: "#16a34a", fontWeight: "bold", fontSize: 12, marginTop: 4 },
  repayButton: { marginTop: 8, backgroundColor: "#16a34a", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  repayText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});