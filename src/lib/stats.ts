// stats.ts
export const stats = {
  totalUsers: 120,
  totalDocuments: 450,
  envelopes: {
    draft: 60,
    sent: 200,
    completed: 150,
    rejected: 40,
  },
};

// Pie chart data for envelope statuses
export const envelopeStatusData = [
  { name: "Draft", value: 60 },
  { name: "Sent", value: 200 },
  { name: "Completed", value: 150 },
  { name: "Rejected", value: 40 },
];

// Bar chart data for documents uploaded per month
export const documentsPerMonth = [
  { month: "Jan", documents: 30 },
  { month: "Feb", documents: 50 },
  { month: "Mar", documents: 40 },
  { month: "Apr", documents: 60 },
  { month: "May", documents: 80 },
  { month: "Jun", documents: 70 },
];
