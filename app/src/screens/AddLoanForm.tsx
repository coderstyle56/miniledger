import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { api } from "../api";

type Props = { token: string; onDone: () => void; onCancel: () => void };

export default function AddLoanForm({ token, onDone, onCancel }: Props) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    const amountNum = Number(amount);

    if (name.trim() === "") return setError("Friend name is required");
    if (!Number.isFinite(amountNum) || amountNum <= 0) return setError("Amount must be greater than 0");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return setError("Due date must be YYYY-MM-DD");

    setLoading(true);
    try {
      await api("/loans", {
        method: "POST",
        token,
        body: { friend_name: name.trim(), amount: amountNum, due_date: dueDate },
      });
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Entry</Text>

      <TextInput style={styles.input} placeholder="Friend name" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Amount (e.g. 500)"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />
      <TextInput
        style={styles.input}
        placeholder="Due date (YYYY-MM-DD)"
        value={dueDate}
        onChangeText={setDueDate}
        maxLength={10}
      />

      {error !== "" && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={onCancel}>
        <Text style={styles.link}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
  button: { backgroundColor: "#2563eb", padding: 14, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#dc2626", marginBottom: 12 },
  link: { color: "#2563eb", textAlign: "center", marginTop: 16 },
});