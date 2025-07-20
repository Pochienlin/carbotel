#!/bin/bash

#  Copyright (C) <year>  <name of author>

#     This program is free software: you can redistribute it and/or modify
#     it under the terms of the GNU General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.

#     This program is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU General Public License for more details.

#     You should have received a copy of the GNU General Public License
#     along with this program.  If not, see <https://www.gnu.org/licenses/>.
__notice="
================================================================================
  CarbOtel  Copyright (C) 2025 Lin Po Chien
    This program comes with ABSOLUTELY NO WARRANTY; for details type \`run_carbotel.sh show w'.
    This is free software, and you are welcome to redistribute it 
    under certain conditions; type \`run_carbotel.sh show c' for details.
--------------------------------------------------------------------------------
"
echo "$__notice"

case "$1" in
  show)
    case "$2" in
      c)
        cat LICENSE
        ;;
      w)
        echo "This program is distributed in the hope that it will be useful,"
        echo "but WITHOUT ANY WARRANTY; without even the implied warranty of"
        echo "MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the"
        echo "GNU General Public License for more details."
        ;;
      *)
        echo "Usage: $0 show [c|w]"
        ;;
    esac
    exit 0
    ;;
esac


echo "CarbOtel -- observation has started."
# Sleep for 2 minutes first for otel to collect data
sleep 120

# Infinite loop
while true; do
  echo "Running npm start at $(date)"
  npm run start

  echo "Sleeping for 2 minutes..."
  sleep 120  # Sleep for 120 seconds (2 minutes)
done