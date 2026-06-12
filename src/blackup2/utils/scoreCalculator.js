export function getNutritionStar(value, type) {
  const rules = {
    sugar: [
      { max: 6, star: 5 },
      { max: 12, star: 4 },
      { max: 18, star: 3 },
      { max: 24, star: 2 },
      { max: Infinity, star: 1 },
    ],
    sodium: [
      { max: 120, star: 5 },
      { max: 240, star: 4 },
      { max: 360, star: 3 },
      { max: 480, star: 2 },
      { max: Infinity, star: 1 },
    ],
    fat: [
      { max: 3, star: 5 },
      { max: 6, star: 4 },
      { max: 9, star: 3 },
      { max: 12, star: 2 },
      { max: Infinity, star: 1 },
    ],
  }

  return rules[type].find((rule) => value <= rule.max).star
}

export function calculateFoodScore(food) {
  const sugarStar = getNutritionStar(Number(food.sugar), 'sugar')
  const sodiumStar = getNutritionStar(Number(food.sodium), 'sodium')
  const fatStar = getNutritionStar(Number(food.fat), 'fat')
  const average = (sugarStar + sodiumStar + fatStar) / 3

  return {
    sugarStar,
    sodiumStar,
    fatStar,
    average: Number(average.toFixed(2)),
  }
}

export function getSpeedBonus(totalSeconds, scannedCount) {
  if (!scannedCount) return { avgSeconds: 0, bonus: 0, label: 'ยังไม่เริ่มสแกน' }

  const avgSeconds = totalSeconds / scannedCount

  if (avgSeconds <= 15) return { avgSeconds, bonus: 0.05, label: 'สายลับสายฟ้า' }
  if (avgSeconds <= 30) return { avgSeconds, bonus: 0.03, label: 'สายลับว่องไว' }
  if (avgSeconds <= 45) return { avgSeconds, bonus: 0.01, label: 'สายลับรอบคอบ' }

  return { avgSeconds, bonus: 0, label: 'สายลับใจเย็น' }
}
