import { useState, useEffect } from "react";

export function useGlobalCoins() {
  const [coins, setCoins] = useState(() => parseInt(localStorage.getItem("coffee_game_coins") || "150"));

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail !== undefined) setCoins(e.detail);
    };
    window.addEventListener("coffee-coins-updated", handleUpdate);
    return () => window.removeEventListener("coffee-coins-updated", handleUpdate);
  }, []);

  const addCoins = (amount: number) => {
    const current = parseInt(localStorage.getItem("coffee_game_coins") || "150");
    const newAmount = Math.max(0, current + amount);
    localStorage.setItem("coffee_game_coins", newAmount.toString());
    window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newAmount }));
    return newAmount;
  };

  const deductCoins = (amount: number) => {
    return addCoins(-amount);
  };

  const resetCoins = (amount: number = 150) => {
    localStorage.setItem("coffee_game_coins", amount.toString());
    window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: amount }));
    return amount;
  };

  return { coins, addCoins, deductCoins, resetCoins };
}
