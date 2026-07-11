{{- define "namespace-operator.name" -}}
hybridsovereign-namespace-operator
{{- end }}

{{- define "namespace-operator.labels" -}}
app.kubernetes.io/name: {{ include "namespace-operator.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
hybridsovereign.redhat/entity: {{ .Values.entityName }}
{{- end }}
