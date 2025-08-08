<!-- PaycheckSheet.vue -->
<template>
  <div class="p-4 max-w-3xl mx-auto">
    <h2 class="text-2xl font-bold mb-4">{{ headerTitle }}</h2>

    <!-- Income -->
    <div class="mb-6 flex items-center gap-12 justify-between" v-if="sheetId">
      <label class="block font-medium mb-1">Total Income</label>
      <input
        v-model.number="income"
        type="number"
        class="w-full p-2 border rounded text-right align-right"
        placeholder="e.g. 1875"
      />
    </div>

    <!-- Savings Table -->
    <div class="mb-6" v-if="sheetId">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-xl font-semibold">Savings</h3>
        <button
          @click="addRow('savings')"
          class="text-sm px-3 py-1 bg-blue-500 text-white rounded"
        >
          + Add
        </button>
      </div>

      <table class="w-full table-auto border">
        <thead>
          <tr class="bg-gray-100">
            <th class="border px-3 py-2 text-left">Category</th>
            <th class="border px-3 py-2 text-left">Amount</th>
            <th class="border px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in savings" :key="`s-${index}`">
            <td class="border px-3 py-2">
              <input
                v-model="item.category"
                class="w-full p-1 border rounded"
                placeholder="e.g. Emergency Fund"
              />
            </td>
            <td class="border px-3 py-2">
              <input
                v-model.number="item.amount"
                type="number"
                class="w-full p-1 border rounded"
                placeholder="e.g. 250"
              />
            </td>
            <td class="border px-3 py-2 text-center">
              <button @click="removeRow('savings', index)" class="text-red-500">
                ✕
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Expenses Table -->
    <div class="mb-6" v-if="sheetId">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-xl font-semibold">Expenses</h3>
        <button
          @click="addRow('expenses')"
          class="text-sm px-3 py-1 bg-blue-500 text-white rounded"
        >
          + Add
        </button>
      </div>

      <table class="w-full table-auto border">
        <thead>
          <tr class="bg-gray-100">
            <th class="border px-3 py-2 text-left">Category</th>
            <th class="border px-3 py-2 text-left">Amount</th>
            <th class="border px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in expenses" :key="`e-${index}`">
            <td class="border px-3 py-2">
              <input
                v-model="item.category"
                class="w-full p-1 border rounded"
                placeholder="e.g. Rent"
              />
            </td>
            <td class="border px-3 py-2">
              <input
                v-model.number="item.amount"
                type="number"
                class="w-full p-1 border rounded"
                placeholder="e.g. 750"
              />
            </td>
            <td class="border px-3 py-2 text-center">
              <button
                @click="removeRow('expenses', index)"
                class="text-red-500"
              >
                ✕
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Summary -->
    <div class="mt-6" v-if="sheetId">
      <p class="text-lg">
        Savings: <strong>${{ savingsTotal }}</strong>
      </p>
      <p class="text-lg">
        Expenses: <strong>${{ expensesTotal }}</strong>
      </p>
      <p class="text-lg">
        Leftover:
        <strong :class="leftover < 0 ? 'text-red-500' : 'text-green-600'"
          >${{ leftover }}</strong
        >
      </p>
    </div>

    <!-- Save Button -->
    <button
      v-if="sheetId"
      class="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      @click="saveSheet"
    >
      Save Sheet
    </button>
    <div v-else class="text-gray-500">
      No sheet selected. Use the tabs below to add or select a sheet.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { sheetStore } from '../db/local';
import type { PaycheckDoc } from '../db/storage';

const props = defineProps<{ sheetId: string | null }>();

type Row = { category: string; amount: number };
const income = ref<number>(0);
const savings = ref<Row[]>([]);
const expenses = ref<Row[]>([]);
const dateStr = ref<string | null>(null);
const nameStr = ref<string | null>(null);

const savingsTotal = computed(() =>
  savings.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
);
const expensesTotal = computed(() =>
  expenses.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
);
const leftover = computed(
  () =>
    (Number(income.value) || 0) - (savingsTotal.value + expensesTotal.value),
);
const headerTitle = computed(() => {
  return nameStr.value ?? dateStr.value ?? props.sheetId ?? '';
});

function addRow(which: 'savings' | 'expenses') {
  const target = which === 'savings' ? savings : expenses;
  target.value.push({ category: '', amount: 0 });
}

function removeRow(which: 'savings' | 'expenses', index: number) {
  const target = which === 'savings' ? savings : expenses;
  target.value.splice(index, 1);
}

function resetState() {
  income.value = 0;
  savings.value = [];
  expenses.value = [];
  dateStr.value = null;
  nameStr.value = null;
}

async function loadSheet(id: string) {
  try {
    const existing = await sheetStore.get(id);
    income.value = existing.income;
    if (Array.isArray(existing.savings)) savings.value = existing.savings;
    else savings.value = [];
    if (Array.isArray(existing.expenses)) expenses.value = existing.expenses;
    else expenses.value = existing.allocations || [];
    dateStr.value = existing.date || null;
    nameStr.value = existing.name || null;
  } catch {
    resetState();
  }
}

async function saveSheet() {
  if (!props.sheetId) return;
  const doc: PaycheckDoc = {
    _id: props.sheetId,
    date: dateStr.value || new Date().toISOString().slice(0, 10),
    name: nameStr.value || undefined,
    income: Number(income.value) || 0,
    savings: savings.value,
    expenses: expenses.value,
    leftover: leftover.value,
  };
  await sheetStore.put(doc);
}

let t: any;
watch(
  [income, savings, expenses],
  () => {
    clearTimeout(t);
    t = setTimeout(() => void saveSheet(), 600);
  },
  { deep: true },
);

watch(
  () => props.sheetId,
  (id) => {
    if (!id) {
      resetState();
      return;
    }
    loadSheet(id);
  },
  { immediate: true },
);
</script>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
}
</style>
