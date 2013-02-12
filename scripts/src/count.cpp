#include <cstdlib>
#include <vector>
#include <fstream>
using namespace std;

int main(int argc, char** argv)
{
	system("wc -l digsim/scripts/src/* > cnt.txt");
	ifstream x("cnt.txt");
	vector<string> words;
	string temp;
	while (x >> temp) 
		words.push_back(temp);	
	vector<string>::iterator it = words.end();
	--it; --it;
	system

}