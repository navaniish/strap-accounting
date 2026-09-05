package com.genz.retail.admin;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.app.NotificationManager;
import android.app.PendingIntent;
import androidx.core.app.NotificationCompat;

public class SalesSubmissionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        if ("com.genz.retail.NEW_SALE_SUBMITTED".equals(intent.getAction())) {
            String shopName = intent.getStringExtra("shop_name");
            String staffName = intent.getStringExtra("staff_name");
            double amount = intent.getDoubleExtra("amount", 0.0);

            if (shopName == null) shopName = "Store Branch";
            if (staffName == null) staffName = "Field Staff";

            String title = "🚨 New Sales Entry Received for Review";
            String body = "Staff " + staffName + " submitted ₹" + (int)amount + " for " + shopName + ". Tap to verify in queue.";

            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage("com.genz.retail.admin");
            PendingIntent pendingIntent = null;
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                pendingIntent = PendingIntent.getActivity(
                    context,
                    0,
                    launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
            }

            int iconId = context.getApplicationInfo().icon;
            if (iconId == 0) {
                iconId = android.R.drawable.ic_dialog_info;
            }

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, "strap_admin_sales_alerts")
                .setSmallIcon(iconId)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setAutoCancel(true);

            if (pendingIntent != null) {
                builder.setContentIntent(pendingIntent);
            }

            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.notify((int) (System.currentTimeMillis() % 100000), builder.build());
            }
        }
    }
}
