#!/usr/bin/env bash

load_env_file() {
  local env_file="${1:-.env}"
  [[ -f "${env_file}" ]] || return 0

  local line key value
  while IFS= read -r line || [[ -n "${line}" ]]; do
    line="${line%$'\r'}"
    [[ -z "${line//[[:space:]]/}" || "${line}" =~ ^[[:space:]]*# ]] && continue
    [[ "${line}" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue

    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"

    if [[ "${value}" == \"*\" && "${value}" == *\" ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "${value}" == \'*\' && "${value}" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi

    export "${key}=${value}"
  done < "${env_file}"
}

timestamped_copy_path() {
  local file_path="$1"
  local dir base name ext stamp candidate counter

  dir="$(dirname "${file_path}")"
  base="$(basename "${file_path}")"
  if [[ "${base}" == *.* ]]; then
    name="${base%.*}"
    ext=".${base##*.}"
  else
    name="${base}"
    ext=""
  fi

  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  candidate="${dir}/${name}-${stamp}${ext}"
  counter=2
  while [[ -e "${candidate}" ]]; do
    candidate="${dir}/${name}-${stamp}-${counter}${ext}"
    counter=$((counter + 1))
  done

  printf '%s\n' "${candidate}"
}

archive_timestamped_copy() {
  local file_path="$1"
  local archive_path

  archive_path="$(timestamped_copy_path "${file_path}")"
  cp -p "${file_path}" "${archive_path}"
  printf '%s\n' "${archive_path}"
}
