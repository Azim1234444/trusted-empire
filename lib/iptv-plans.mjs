export const iptvPlans = [
  { name: 'MSTV', options: [
    { duration: '1 minggu', price: 10 },
    { duration: '1 bulan', devices: 1, price: 25 },
    { duration: '3 bulan', devices: 1, price: 50 },
    { duration: '6 bulan', devices: 1, price: 95 },
    { duration: '1 tahun', devices: 1, price: 190 },
    { duration: '1 bulan', devices: 2, price: 45 },
    { duration: '3 bulan', devices: 2, price: 90 },
  ] },
  { name: 'SYBERTV', options: [
    { duration: '1 bulan', price: 14 },
    { duration: '3 bulan', price: 38 },
    { duration: '6 bulan', price: 70 },
    { duration: '12 bulan', price: 115 },
    { duration: '24 bulan', price: 175 },
    { duration: '3 tahun', price: 230 },
  ] },
  { name: 'WDHD', options: [
    { duration: '31 hari', price: 28 },
    { duration: '100 hari', price: 80 },
    { duration: '205 hari', price: 130 },
    { duration: '420 hari', price: 230 },
  ] },
  { name: 'MYIPTV4K (WAWA)', options: [
    { duration: '3 bulan (90 hari)', price: 110 },
    { duration: '6 bulan (185 hari)', price: 170 },
    { duration: '1 tahun (375 hari)', price: 270 },
  ] },
  { name: 'GO XPlay', options: [
    { duration: '1 bulan', price: 20 },
    { duration: '3 bulan', price: 50 },
  ] },
];

// Each exact duration/device combination is an independently priced order item.
export const iptvOptions = iptvPlans.flatMap((plan) =>
  plan.options.map((option) => ({
    id: `${plan.name}-${option.duration}-${'devices' in option ? option.devices : 'unspecified'}`
      .toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: plan.name,
    detail: `${option.duration}${'devices' in option ? ` · ${option.devices} peranti` : ''}`,
    price: option.price,
    // Zero means a day/week term; the exact term is retained by the plan ID.
    months: option.duration.includes('bulan') ? Number.parseInt(option.duration)
      : option.duration.includes('tahun') ? Number.parseInt(option.duration) * 12 : 0,
  })),
);
