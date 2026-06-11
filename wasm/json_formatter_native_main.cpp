#include <cstdlib>
#include <iostream>
#include <sstream>

extern "C" char *format_json( const char *input );
extern "C" const char *get_last_error();
extern "C" void free_string( char *value );

int main()
{
    std::stringstream input;
    input << std::cin.rdbuf();
    char *formatted = format_json( input.str().c_str() );
    if( formatted == nullptr ) {
        std::cerr << get_last_error() << '\n';
        return EXIT_FAILURE;
    }
    std::cout << formatted;
    free_string( formatted );
    return EXIT_SUCCESS;
}
