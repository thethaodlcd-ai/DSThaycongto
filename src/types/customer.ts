export interface Customer {
  unitCode: string; // Mã đơn vị
  deviceCode: string; // Mã thiết bị
  deviceNumber: string; // số thiết bị
  typeCode: string; // Mã chủng loại
  current: string; // Dòng điện
  voltage: string; // điện áp
  phases: string; // số pha
  inspectionDate: string; // Ngày kiểm định
  inspectionExpiry: string; // Hạn kiểm định
  measurementPointCode: string; // Mã điển đo
  customerCode: string; // Mã khách hàng
  multiplier: string; // Hệ số nhân
  installRemoveDate: string; // Ngày treo tháo
  areaCode: string; // Mã khu vực
  areaNumber: string; // Số khu vực
  customerName: string; // Tên khách hàng
  electricityUsageAddress: string; // Địa chỉ sử dụng điện
  customerAddress: string; // Địa chỉ sử khách hàng
  poleNumber: string; // Số trụ
  bookCode: string; // Mã sổ ghi điện
  stationCode: string; // Mã trạm
  phoneNumber: string; // Số điiện thoại
  priceString: string; // Chuỗi giá
  directIndirectType: string; // Loại trực tiếp, gián giếp
  tiRatio: string; // Tỷ số TI đấu
  notes: string; // Ghi chú
  
  // Aliases for compatibility
  address?: string;
  stt?: string;
}

export function parseCustomerData(row: string[]): Customer {
  return {
    unitCode: row[0] || '',
    deviceCode: row[1] || '',
    deviceNumber: row[2] || '',
    typeCode: row[3] || '',
    current: row[4] || '',
    voltage: row[5] || '',
    phases: row[6] || '',
    inspectionDate: row[7] || '',
    inspectionExpiry: row[8] || '',
    measurementPointCode: row[9] || '',
    customerCode: row[10] || '',
    multiplier: row[11] || '',
    installRemoveDate: row[12] || '',
    areaCode: row[13] || '',
    areaNumber: row[14] || '',
    customerName: row[15] || '',
    electricityUsageAddress: row[16] || '',
    customerAddress: row[17] || '',
    poleNumber: row[18] || '',
    bookCode: row[19] || '',
    stationCode: row[20] || '',
    phoneNumber: row[21] || '',
    priceString: row[22] || '',
    directIndirectType: row[23] || '',
    tiRatio: row[24] || '',
    notes: row[25] || '',

    // Computed aliases
    address: row[16] || row[17] || '',
    stt: '',
  };
}
