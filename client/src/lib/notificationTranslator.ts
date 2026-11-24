/**
 * Notification Bilingual Translator
 * Translates backend-generated notification titles & messages to English when user selects 'en'.
 */

export function translateNotification(
  title: string,
  message: string,
  lang: string
): { title: string; message: string } {
  if (lang !== 'en') {
    return { title, message };
  }

  let translatedTitle = title;
  let translatedMessage = message;

  // 1. Translate Titles
  const titleMap: Record<string, string> = {
    'Đơn hàng đã hoàn thành': 'Order Completed',
    'Giao đơn thành công': 'Order Delivered Successfully',
    'Xác thực thành công': 'Verification Successful',
    'Đơn hàng đã về tới điểm hẹn': 'Order Arrived at Pickup Lobby',
    'Đã tiếp nhận đồ ăn từ tài xế': 'Food Collected from Driver',
    'Đơn hàng đã được tiếp nhận': 'Order Accepted by Receiver',
    'Tiếp nhận đơn hàng thành công': 'Order Accepted Successfully',
    'Đơn hàng mới đã được khởi tạo': 'New Order Created',
    'Có đơn nhận hộ mới trên hệ thống': 'New Delivery Request Available',
    'Đơn nhận hộ đã bị hủy': 'Delivery Request Cancelled',
    'Đã hủy đơn thành công': 'Order Cancelled Successfully',
    'Đã hủy đơn hàng & Hoàn tiền': 'Order Cancelled & Refunded',
    'Thay đổi số dư tài khoản': 'Wallet Balance Updated',
    'Giao dịch nạp tiền thành công': 'Deposit Successful',
    'Giao dịch rút tiền thành công': 'Withdrawal Successful',
    'Yêu cầu rút tiền đã được gửi': 'Withdrawal Request Submitted',
    'Giao dịch bị từ chối': 'Transaction Rejected',
    'Yêu cầu hỗ trợ đã được ghi nhận': 'Support Ticket Received',
    'Báo cáo khiếu nại mới': 'New Support Ticket',
    'Yêu cầu nạp tiền đã được phê duyệt': 'Top-up Request Approved',
    'Yêu cầu hỗ trợ bị từ chối': 'Support Request Rejected',
    'Sự cố đã được giải quyết': 'Issue Resolved',
  };

  if (titleMap[title]) {
    translatedTitle = titleMap[title];
  } else {
    // Partial title matching
    if (title.includes('hoàn thành')) translatedTitle = 'Order Completed';
    else if (title.includes('tiếp nhận')) translatedTitle = 'Order Accepted';
    else if (title.includes('hủy')) translatedTitle = 'Order Cancelled';
    else if (title.includes('số dư')) translatedTitle = 'Balance Update';
    else if (title.includes('nạp tiền')) translatedTitle = 'Top-up Notification';
  }

  // 2. Translate Message Bodies
  if (
    message.includes('đã bàn giao thành công') &&
    message.includes('Cảm ơn bạn đã sử dụng F-Lunch')
  ) {
    const match = message.match(/Đơn nhận hộ\s+([^\s]+)\s+đã bàn giao/i);
    const platform = match ? match[1] : 'Food';
    translatedMessage = `Your ${platform} order has been handed over successfully. Thank you for using F-Lunch! Please leave a rating.`;
  } else if (
    message.includes('Đồ ăn của bạn đã về tới Sảnh Trống Đồng')
  ) {
    translatedMessage = 'Your food has arrived at Trong Dong Lobby. Please open the app and show your QR code to the receiver to collect.';
  } else if (
    message.includes('đã lấy đồ ăn') &&
    message.includes('từ tài xế')
  ) {
    const receiverMatch = message.match(/Người nhận hộ\s+(.*?)\s+đã lấy/i);
    const platformMatch = message.match(/đồ ăn\s+([^\s]+)\s+từ/i);
    const receiverName = receiverMatch ? receiverMatch[1] : 'Receiver';
    const platform = platformMatch ? platformMatch[1] : 'delivery';
    translatedMessage = `Receiver ${receiverName} collected your ${platform} order from the driver successfully.`;
  } else if (
    message.includes('đã nhận đơn') &&
    message.includes('của bạn và đang di chuyển tới')
  ) {
    const receiverMatch = message.match(/Người nhận hộ\s+(.*?)\s+đã nhận/i);
    const platformMatch = message.match(/đơn\s+([^\s]+)\s+của/i);
    const gateMatch = message.match(/di chuyển tới\s+(.*?)\.?$/i);
    const receiverName = receiverMatch ? receiverMatch[1] : 'Receiver';
    const platform = platformMatch ? platformMatch[1] : 'food';
    const gate = gateMatch ? gateMatch[1] : 'campus gate';
    translatedMessage = `Receiver ${receiverName} accepted your ${platform} order and is heading to ${gate}.`;
  } else if (
    message.includes('đã tạo thành công. Phí dịch vụ')
  ) {
    const platformMatch = message.match(/Đơn nhận hộ\s+([^\s]+)/i);
    const codeMatch = message.match(/Mã:\s*([^)]+)/i);
    const platform = platformMatch ? platformMatch[1] : 'Food';
    const code = codeMatch ? codeMatch[1] : '';
    translatedMessage = `Pickup request for ${platform} ${code ? `(Code: ${code}) ` : ''}created successfully. Service fee: 5,000 VND.`;
  } else if (
    message.includes('Số dư ví của bạn vừa được điều chỉnh')
  ) {
    const amountMatch = message.match(/điều chỉnh\s+([+-]?[\d.,]+đ)/i);
    const walletMatch = message.match(/\(([^)]+)\)/i);
    const noteMatch = message.match(/Ghi chú:\s*(.+)$/i);
    const amount = amountMatch ? amountMatch[1] : '';
    const wallet = walletMatch ? walletMatch[1].replace('Ví chính', 'Main Wallet').replace('Ví KM', 'Promo Wallet') : 'Wallet';
    const note = noteMatch ? noteMatch[1] : '';
    translatedMessage = `Your balance was adjusted by ${amount} (${wallet}).${note ? ` Note: ${note}` : ''}`;
  } else if (
    message.includes('đã được hủy. 5.000đ phí dịch vụ đã được hoàn lại')
  ) {
    const platformMatch = message.match(/Đơn nhận hộ\s+([^\s]+)/i);
    const platform = platformMatch ? platformMatch[1] : 'Food';
    translatedMessage = `Your ${platform} pickup request was cancelled. 5,000 VND service fee has been refunded to your wallet.`;
  } else if (
    message.includes('Tài khoản vừa được cộng') ||
    message.includes('Tài khoản của bạn đã được cộng')
  ) {
    const amountMatch = message.match(/được cộng\s+([\d.,]+đ)/i);
    const codeMatch = message.match(/Mã GD:\s*([^\s.]+)/i);
    const amount = amountMatch ? amountMatch[1] : '';
    const code = codeMatch ? codeMatch[1] : '';
    translatedMessage = `Your account was credited with ${amount}.${code ? ` Transaction code: ${code}` : ''}`;
  } else if (
    message.includes('đã từ chối nhận đơn')
  ) {
    const receiverMatch = message.match(/Người nhận hộ\s+(.*?)\s+đã từ chối/i);
    const platformMatch = message.match(/đơn\s+([^\s]+)\s+của/i);
    const receiverName = receiverMatch ? receiverMatch[1] : 'Receiver';
    const platform = platformMatch ? platformMatch[1] : 'delivery';
    translatedMessage = `Receiver ${receiverName} declined your ${platform} order. 5,000 VND fee has been refunded to your wallet!`;
  } else if (
    message.includes('Yêu cầu phản ánh') &&
    message.includes('của bạn đã được ghi nhận')
  ) {
    translatedMessage = 'Your support ticket has been received. Our administrators will review and respond shortly!';
  }

  return { title: translatedTitle, message: translatedMessage };
}
