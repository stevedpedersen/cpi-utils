# cpi-utils
Package/Artifact comparison tool, etc. for SAP BTP Cloud Integration (aka CPI)




or (64bit installation)
```pwsh
npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"
npm config set shell "C:\\Program Files\\git\\bin\\bash.exe"
```
Note that you need to have git for windows installed.


You can revert it by running:
```pwsh
npm config delete script-shell
npm config delete shell
```


/IntegrationPackages('{Id}')/IntegrationDesigntimeArtifacts
    - https://api.sap.com/api/IntegrationContent/path/get_IntegrationPackages___Id____IntegrationDesigntimeArtifacts

/IntegrationPackages('{Id}')/MessageMappingDesigntimeArtifacts
    - https://api.sap.com/api/IntegrationContent/path/get_IntegrationPackages___Id____MessageMappingDesigntimeArtifacts

/IntegrationPackages('{Id}')/ValueMappingDesigntimeArtifacts
    - https://api.sap.com/api/IntegrationContent/path/get_IntegrationPackages___Id____ValueMappingDesigntimeArtifacts
/IntegrationPackages('{Id}')/ScriptCollectionDesigntimeArtifacts
    - https://api.sap.com/api/IntegrationContent/path/get_IntegrationPackages___Id____ScriptCollectionDesigntimeArtifacts





https://api.sap.com/api/IntegrationContent/path/get_MessageMappingDesigntimeArtifacts


https://api.sap.com/api/IntegrationContent/resource/Value_Mappings
- /ValueMappingDesigntimeArtifacts

https://api.sap.com/api/IntegrationContent/resource/Integration_Adapter
- /IntegrationAdapterDesigntimeArtifacts

https://api.sap.com/api/IntegrationContent/resource/Message_Mappings
- /MessageMappingDesigntimeArtifacts

https://api.sap.com/api/IntegrationContent/resource/Script_Collections