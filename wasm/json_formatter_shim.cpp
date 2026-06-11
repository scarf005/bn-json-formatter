#include <string>

std::string replace_all( std::string input, const std::string &what, const std::string &with )
{
    if( what.empty() ) {
        return input;
    }
    for( std::size_t pos = 0; ( pos = input.find( what, pos ) ) != std::string::npos; pos += with.size() ) {
        input.replace( pos, what.size(), with );
    }
    return input;
}
