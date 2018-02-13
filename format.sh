
for f in $(find .|grep -v node_modules|grep "\.js$");
do
    js-beautify -r $f
done
