pattern="_server"
for _dir in *"${pattern}"; do
    [ -d "${_dir}" ] && dir="${_dir}" && break
done
cd "${dir}" || exit
serverpod generate