
LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE    := ks
LOCAL_SRC_FILES := KillSudoku.cpp

include $(BUILD_SHARED_LIBRARY)
