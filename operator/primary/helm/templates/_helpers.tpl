{{- define "primary-operator.name" -}}
hybridsovereign-primary-operator
{{- end }}

{{- define "primary-operator.labels" -}}
app.kubernetes.io/name: {{ include "primary-operator.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: hybridsovereign
{{- end }}

{{- define "primary-operator.selectorLabels" -}}
app.kubernetes.io/name: {{ include "primary-operator.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
