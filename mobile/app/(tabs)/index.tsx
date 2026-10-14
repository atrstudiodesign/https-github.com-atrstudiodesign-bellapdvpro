import { View, Text, TouchableOpacity } from "react-native";
import { useAuthStore } from "../../store/useAuthStore";

export default function Home() {
  const { role } = useAuthStore();

  return (
    <View className="flex-1 bg-slate-900 justify-center items-center p-4">
      <Text className="text-white text-3xl font-bold mb-2">BellaPDV Mobile</Text>
      <Text className="text-slate-400 text-lg mb-8">Role: {role}</Text>
      
      <View className="w-full gap-4">
        {role === 'dono' && (
          <TouchableOpacity className="bg-blue-600 p-4 rounded-xl items-center">
            <Text className="text-white font-bold">Ver Faturamento</Text>
          </TouchableOpacity>
        )}
        
        {role === 'profissional' && (
          <TouchableOpacity className="bg-purple-600 p-4 rounded-xl items-center">
            <Text className="text-white font-bold">Fazer Check-in</Text>
          </TouchableOpacity>
        )}
        
        {role === 'cliente' && (
          <TouchableOpacity className="bg-emerald-600 p-4 rounded-xl items-center">
            <Text className="text-white font-bold">Agendar Horário</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
