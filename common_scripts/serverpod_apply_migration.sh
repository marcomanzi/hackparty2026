pattern="_server"
for _dir in *"${pattern}"; do
    [ -d "${_dir}" ] && dir="${_dir}" && break
done
cd "${dir}" || exit

dart run bin/main.dart --role maintenance --apply-migrations