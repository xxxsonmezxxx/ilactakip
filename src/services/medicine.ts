export type MedicineRecord = {
  id: string;
  name: string;
  schedule: string[];
  note: string;
  isTaken: boolean;
  foodInstruction: "Aç" | "Tok" | "Herhangi";
};

export const exampleMedicines: MedicineRecord[] = [
  {
    id: "m1",
    name: "Parol 500mg",
    schedule: ["09:00", "21:00"],
    note: "Tok karnına alın",
    isTaken: false,
    foodInstruction: "Tok",
  },
  {
    id: "m2",
    name: "Vitamin D",
    schedule: ["08:00"],
    note: "Aç karnına alın",
    isTaken: false,
    foodInstruction: "Aç",
  },
];
