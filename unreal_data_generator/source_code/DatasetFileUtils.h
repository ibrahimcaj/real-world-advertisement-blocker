// Fill out your copyright notice in the Description page of Project Settings.

#pragma once

#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "DatasetFileUtils.generated.h"

UCLASS()
class SYNTHETICADS_API UDatasetFileUtils : public UBlueprintFunctionLibrary
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category = "Synthetic Dataset")
    static bool SaveTextToFile(const FString& FullFilePath, const FString& Text);
};