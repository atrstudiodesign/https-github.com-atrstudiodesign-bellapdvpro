import { View, Text } from "react-native";

export default function Caixa() {
  return (
    <View className="flex-1 bg-slate-900 p-4">
      <Text className="text-white text-2xl font-bold mb-4">Caixa</Text>
      <View className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <Text className="text-slate-400">Faturamento do Dia</Text>
        <Text className="text-green-400 text-3xl font-bold mt-2">R$ 1.250,00</Text>
      </View>
    </View>
  );
}
