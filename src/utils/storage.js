const STORAGE_KEY = 'ollietime_records';

export const getRecords = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveRecords = (records) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const getRecordByDate = (date) => {
  const records = getRecords();
  return records.find(record => record.date === date);
};

export const saveRecord = (record) => {
  const records = getRecords();
  const existingIndex = records.findIndex(r => r.date === record.date);

  if (existingIndex >= 0) {
    records[existingIndex] = { ...records[existingIndex], ...record };
  } else {
    records.push(record);
  }

  saveRecords(records);
  return records;
};

export const deleteRecord = (date) => {
  const records = getRecords();
  const filtered = records.filter(r => r.date !== date);
  saveRecords(filtered);
  return filtered;
};

export const updateRecord = (date, updatedData) => {
  const records = getRecords();
  const index = records.findIndex(r => r.date === date);

  if (index >= 0) {
    records[index] = { ...records[index], ...updatedData };
    saveRecords(records);
  }

  return records;
};

export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentTimeKST = () => {
  const now = new Date();
  const kstOffset = 9 * 60;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kstTime = new Date(utc + (kstOffset * 60000));

  const hours = String(kstTime.getHours()).padStart(2, '0');
  const minutes = String(kstTime.getMinutes()).padStart(2, '0');
  const seconds = String(kstTime.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

export const calculateWorkHours = (startTime, endTime) => {
  if (!startTime || !endTime) return null;

  const [startH, startM, startS] = startTime.split(':').map(Number);
  const [endH, endM, endS] = endTime.split(':').map(Number);

  const startMinutes = startH * 60 + startM + startS / 60;
  const endMinutes = endH * 60 + endM + endS / 60;

  const diff = endMinutes - startMinutes;

  if (diff < 0) return null;

  const hours = Math.floor(diff / 60);
  const minutes = Math.floor(diff % 60);

  return { hours, minutes, totalMinutes: diff };
};

export const exportToCSV = (records) => {
  const headers = ['날짜', '근무 시작', '근무 종료', '총 근무시간'];
  const rows = records.map(record => {
    const workHours = calculateWorkHours(record.startTime, record.endTime);
    const duration = workHours
      ? `${workHours.hours}시간 ${workHours.minutes}분`
      : '-';
    return [
      record.date,
      record.startTime || '-',
      record.endTime || '-',
      duration
    ];
  });

  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `윤스피치_근무기록_${formatDate(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
