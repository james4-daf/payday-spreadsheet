<!-- src/components/SheetTabs.vue -->
<template>
  <div class="fixed bottom-0 left-0 right-0 bg-white border-t">
    <div
      class="max-w-5xl mx-auto px-2 py-2 flex items-center justify-center gap-2 overflow-x-auto"
    >
      <button
        v-for="t in tabs"
        :key="t.id"
        class="px-3 py-1 rounded border whitespace-nowrap"
        :class="
          t.id === modelValue
            ? 'bg-blue-50 border-blue-400 text-blue-700'
            : 'bg-gray-50 hover:bg-gray-100'
        "
        @click="$emit('update:modelValue', t.id)"
        :title="t.id"
      >
        {{ t.label }}
        <span
          class="ml-2 text-xs text-gray-600 hover:text-gray-900"
          title="Duplicate"
          @click.stop="onDuplicate(t.id)"
        >
          ⧉
        </span>
        <span
          class="ml-2 text-xs text-gray-600 hover:text-gray-900"
          title="Rename"
          @click.stop="onRename(t.id)"
        >
          ✎
        </span>
        <span
          class="ml-2 text-xs text-red-500 hover:text-red-700"
          @click.stop="onDelete(t.id)"
        >
          ✕
        </span>
      </button>

      <button
        class="ml-1 px-3 py-1 rounded border bg-green-50 text-green-700 hover:bg-green-100"
        @click="onAdd"
      >
        + Sheet
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { sheetStore } from '../db/local';
import type { PaycheckDoc } from '../db/storage';

const props = defineProps<{ modelValue: string | null }>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: string | null): void;
}>();

type Tab = { id: string; label: string };
const tabs = ref<Tab[]>([]);

function labelFor(doc: PaycheckDoc, id: string) {
  return doc.name || doc.date || id;
}

async function loadTabs() {
  const ids = await sheetStore.list('pay_');
  const docs = await Promise.all(
    ids.map(async (id) => {
      try {
        const d = await sheetStore.get(id);
        return { id, label: labelFor(d, id) };
      } catch {
        return { id, label: id };
      }
    }),
  );
  tabs.value = docs;
  if (!props.modelValue && tabs.value.length) {
    emit('update:modelValue', tabs.value[0].id);
  }
}

async function onAdd() {
  const id = `pay_${Date.now()}`;
  const date = new Date().toISOString().slice(0, 10);
  const doc: PaycheckDoc = {
    _id: id,
    name: `Sheet ${tabs.value.length + 1}`,
    date,
    income: 0,
    allocations: [],
    leftover: 0,
  };
  await sheetStore.put(doc);
  await loadTabs();
  emit('update:modelValue', id);
}

async function onDelete(id: string) {
  if (!confirm('Delete this sheet?')) return;
  await sheetStore.remove(id);
  await loadTabs();
  if (props.modelValue === id) {
    emit('update:modelValue', tabs.value.length ? tabs.value[0].id : null);
  }
}

async function onRename(id: string) {
  try {
    const current = await sheetStore.get(id);
    const newName = window.prompt('Rename sheet', current.name || '')?.trim();
    if (!newName) return;
    await sheetStore.put({ ...current, name: newName });
    await loadTabs();
  } catch {}
}

async function onDuplicate(id: string) {
  try {
    const src = await sheetStore.get(id);
    const defaultName = src.name || '';
    const name = window
      .prompt('Duplicate sheet: enter name for the copy', defaultName)
      ?.trim();
    if (!name) return;
    const newId = `pay_${Date.now()}`;
    const date = new Date().toISOString().slice(0, 10);
    const savings = Array.isArray(src.savings) ? src.savings : [];
    const expenses = Array.isArray(src.expenses)
      ? src.expenses
      : src.allocations || [];
    const income = Number(src.income) || 0;
    const sum = (arr: { amount: number }[]) =>
      arr.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const leftover = income - (sum(savings) + sum(expenses));
    await sheetStore.put({
      _id: newId,
      name,
      date,
      income,
      savings,
      expenses,
      leftover,
    });
    await loadTabs();
    emit('update:modelValue', newId);
  } catch {}
}

onMounted(loadTabs);
watch(
  () => props.modelValue,
  () => void 0,
);
</script>
