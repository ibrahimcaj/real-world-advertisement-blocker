// Fill out your copyright notice in the Description page of Project Settings.


#include "DatasetFileUtils.h"

#include "DatasetFileUtils.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "HAL/PlatformFilemanager.h"

bool UDatasetFileUtils::SaveTextToFile(const FString& FullFilePath, const FString& Text)
{
    FString Directory = FPaths::GetPath(FullFilePath);

    if (!Directory.IsEmpty())
    {
        IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();

        if (!PlatformFile.DirectoryExists(*Directory))
        {
            PlatformFile.CreateDirectoryTree(*Directory);
        }
    }

    return FFileHelper::SaveStringToFile(Text, *FullFilePath);
}