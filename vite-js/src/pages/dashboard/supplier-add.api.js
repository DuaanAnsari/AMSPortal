import axios from 'src/utils/axios';

export function buildSupplierCreatePayload(form) {
  const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const toBoolFromYesNo = (value) => String(value || '').trim().toLowerCase() === 'yes';

  return {
    supplierStatus: form.supplierStatus || '',
    venderName: form.name || '',
    venderCategoryID: toNumber(form.vendorCategoryId),
    venderAddress: form.address || '',
    town: form.town || '',
    street: form.street || '',
    cityID: toNumber(form.cityId),
    contactPerson: form.contactPerson || '',
    designation: form.designation || '',
    phoneNumberPrincipal: form.phoneNumberPrincipal || '',
    phoneNumberOthers: form.phoneNumberOthers || '',
    cellNumber: form.cellNumber || '',
    faxNo: form.faxNo || '',
    email: form.merchandiserEmail || '',
    email2: form.merchandiserEmail2 || '',
    email3: form.merchandiserEmail3 || '',
    ceoEmail: form.ceoEmail || '',
    shortName: form.shortName || '',
    productGroupIds: Array.isArray(form.productGroupIds) ? form.productGroupIds.map(toNumber) : [],
    verticalIntegrationIds: Array.isArray(form.verticalIntegrationIds)
      ? form.verticalIntegrationIds.map(toNumber)
      : [],
    socialCompliance: toNumber(form.socialCompliance),
    supplyChain: toNumber(form.supplyChain),
    businessDevelopment: toNumber(form.businessDevelopment),
    qaGroup: toNumber(form.qd),
    managementApproval: toBoolFromYesNo(form.managementApproval),
    aboutSupplier: form.aboutSupplier || '',
    annualturnover: form.annualTurnover || '',
    amtSign: form.turnoverUnit || '',
    supplyChainEvaluation: toBoolFromYesNo(form.supplyChainEvaluation),
    capacity: toNumber(form.capacity),
    capacityUnit: form.capacityUnit || '',
    username: form.username || '',
    password: form.password || '',
    role: '',
    managerId: 0,
  };
}

export async function createSupplierWithUser(payload) {
  const { data } = await axios.post('/api/MyOrders/Create-Vender-With-User', payload);
  return data;
}
