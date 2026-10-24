import { useEffect, useState } from "react";
import { View, Text, Button, ActivityIndicator, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";

const TOKEN_KEY = "token";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY)
      .then(setToken)
      .finally(() => setChecking(false));
  }, []);

  async function handleLoggedIn(newToken: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    setToken(newToken);
  }

  async function handleLogout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
  }

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!token) {
    return <LoginScreen onLoggedIn={handleLoggedIn} />;
  }

  // return (
  //   <View style={styles.center}>
  //     <Text style={styles.text}>Logged in!</Text>
  //     <Button title="Logout" onPress={handleLogout} />
  //   </View>
  // );
  return <HomeScreen token={token} onLogout={handleLogout} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 22, marginBottom: 16 },
});