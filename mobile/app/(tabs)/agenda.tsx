import { View, Text } from "react-native";

export default function Agenda() {
  return (
    <View className="flex-1 bg-slate-900 p-4">
      <Text className="text-white text-2xl font-bold mb-4">Agenda</Text>
      <View className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <Text className="text-white">14:00 - Corte de Cabelo (João)</Text>
      </View>
    </View>
  );
}
