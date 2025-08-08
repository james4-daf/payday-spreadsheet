<script setup lang="ts">
import { inject } from '@vercel/analytics';
import { onMounted, ref } from 'vue';
import PaycheckSheet from './components/PaycheckSheet.vue';
import SheetTabs from './components/SheetTabs.vue';
import { sheetStore } from './db/local';
import type { PaycheckDoc } from './db/storage';

const currentSheetId = ref<string | null>(null);

async function ensureInitialSheet() {
  const ids = await sheetStore.list('pay_');
  if (ids.length === 0) {
    const id = `pay_${Date.now()}`;
    const date = new Date().toISOString().slice(0, 10);
    const doc: PaycheckDoc = {
      _id: id,
      name: 'Sheet 1',
      date,
      income: 0,
      savings: [],
      expenses: [],
      leftover: 0,
    };
    await sheetStore.put(doc);
    currentSheetId.value = id;
  } else {
    currentSheetId.value = ids[0];
  }
}

onMounted(() => {
  inject();
  void ensureInitialSheet();
  // Request persistent storage to reduce eviction under storage pressure
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
});
</script>

<template>
  <div class="min-h-screen pb-16">
    <PaycheckSheet :sheetId="currentSheetId" />
    <SheetTabs v-model="currentSheetId" />
  </div>
</template>
