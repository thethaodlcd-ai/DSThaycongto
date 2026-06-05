export interface Customer {
  stt: string; // Số thứ tự
  customerCode: string; // Mã khách hàng
  customerName: string; // Tên khách hàng
  address: string; // Địa chỉ
  deviceNumber: string; // Số thiết bị
  typeCode: string; // Mã chủng loại
  current: string; // Dòng điện
  voltage: string; // Điện áp
  phases: string; // Số pha
  bookCode: string; // Mã sổ
  areaCode: string; // Mã khu vực
  sequenceInStation: string; // Số thứ tự trong trạm
  stationCode: string; // Mã trạm
  phoneNumber: string; // Số điện thoại
  notes: string; // Ghi chú
}

export function parseCustomerData(row: string[]): Customer {
  return {
    stt: row[0] || '',
    customerCode: row[1] || '',
    customerName: row[2] || '',
    address: row[3] || '',
    deviceNumber: row[4] || '',
    typeCode: row[5] || '',
    current: row[6] || '',
    voltage: row[7] || '',
    phases: row[8] || '',
    bookCode: row[9] || '',
    areaCode: row[10] || '',
    sequenceInStation: row[11] || '',
    stationCode: row[12] || '',
    phoneNumber: row[13] || '',
    notes: row[14] || '',
  };
}
