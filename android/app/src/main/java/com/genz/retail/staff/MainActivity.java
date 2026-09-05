package com.genz.retail.staff;

import android.os.Bundle;
import android.os.Environment;
import android.os.Build;
import android.app.DownloadManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.net.Uri;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import android.util.Base64;
import java.net.URLDecoder;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth.class);
        super.onCreate(savedInstanceState);

        // Native Android High-Importance NotificationChannel registration
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "strap_admin_sales_alerts",
                "Sales Submissions Alerts",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("High importance notifications for store sales submissions");
            channel.enableVibration(true);
            channel.enableLights(true);
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }

        try {
            this.bridge.getWebView().setDownloadListener(new DownloadListener() {
                @Override
                public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                    try {
                        String fileName = "GenZ_Sales_Report_" + System.currentTimeMillis() + ".csv";
                        if (contentDisposition != null && contentDisposition.contains("filename=")) {
                            fileName = contentDisposition.substring(contentDisposition.indexOf("filename=") + 9)
                                    .replace("\"", "").replace(";", "").trim();
                        }

                        if (url != null && url.startsWith("data:")) {
                            byte[] bytes;
                            if (url.contains(";base64,")) {
                                String base64Data = url.substring(url.indexOf(";base64,") + 8);
                                bytes = Base64.decode(base64Data, Base64.DEFAULT);
                            } else {
                                String dataContent = url.substring(url.indexOf(",") + 1);
                                String decodedStr = URLDecoder.decode(dataContent, "UTF-8");
                                bytes = decodedStr.getBytes("UTF-8");
                            }

                            File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                            if (!downloadsDir.exists()) {
                                downloadsDir.mkdirs();
                            }

                            File outFile = new File(downloadsDir, fileName);
                            FileOutputStream fos = new FileOutputStream(outFile);
                            fos.write(bytes);
                            fos.flush();
                            fos.close();

                            DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                            if (dm != null) {
                                dm.addCompletedDownload(
                                    fileName,
                                    "GenZ Sales Data Report",
                                    true,
                                    "text/csv",
                                    outFile.getAbsolutePath(),
                                    outFile.length(),
                                    true
                                );
                            }

                            Toast.makeText(MainActivity.this, "✅ Saved to Downloads: " + fileName, Toast.LENGTH_LONG).show();
                        } else if (url != null) {
                            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                            request.setMimeType(mimeType != null ? mimeType : "text/csv");
                            request.setTitle(fileName);
                            request.setDescription("Downloading GenZ Sales Data Report...");
                            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);

                            DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                            if (dm != null) {
                                dm.enqueue(request);
                                Toast.makeText(MainActivity.this, "📥 Downloading to Downloads folder...", Toast.LENGTH_SHORT).show();
                            }
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        Toast.makeText(MainActivity.this, "Download error: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    }
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
