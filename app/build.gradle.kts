plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.vibe.arcadegame"
    compileSdk = 34

    signingConfigs {
        getByName("debug") {
            storeFile = file("../keystore/reino-cubano.keystore")
            storePassword = "reinocubano2024"
            keyAlias = "reinocubano"
            keyPassword = "reinocubano2024"
        }
    }

    defaultConfig {
        applicationId = "com.vibe.arcadegame"
        minSdk = 24
        targetSdk = 34
        versionCode = 3
        versionName = "2.1"
    }

    buildTypes {
        getByName("debug") {
            signingConfig = signingConfigs.getByName("debug")
        }
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-ktx:1.9.0")
}
