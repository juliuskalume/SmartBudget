package com.smartbudget.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.smartbudget.app.plugins.SmartBudgetHapticsPlugin;
import com.smartbudget.app.plugins.SmartBudgetSmsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SmartBudgetHapticsPlugin.class);
        registerPlugin(SmartBudgetSmsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
