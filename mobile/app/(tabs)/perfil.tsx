import { View, Text, TouchableOpacity } from "react-native";
import { useAuthStore } from "../../store/useAuthStore";

export default function Perfil() {
  const { setRole } = useAuthStore();

  return (
    <View className="flex-1 bg-slate-900 p-4">
      <Text className="text-white text-2xl font-bold mb-4">Perfil</Text>
      
      <Text className="text-slate-400 mb-4">Mudar visão (Mock para testes):</Text>
      <View className="gap-2">
        <TouchableOpacity onPress={() => setRole('dono')} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
          <Text className="text-white">Visão: Dono</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRole('profissional')} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
          <Text className="text-white">Visão: Profissional</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRole('cliente')} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
          <Text className="text-white">Visão: Cliente Final</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
