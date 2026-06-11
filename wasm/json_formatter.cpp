#include "json.h"

#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <exception>
#include <functional>
#include <sstream>
#include <string>

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

static std::string last_error;

static void format( JsonIn &jsin, JsonOut &jsout, int depth = -1, bool force_wrap = false );

static char *make_c_string( const std::string &value )
{
    char *result = static_cast<char *>( std::malloc( value.size() + 1 ) );
    if( result == nullptr ) {
        last_error = "Unable to allocate formatter output.";
        return nullptr;
    }
    std::memcpy( result, value.c_str(), value.size() + 1 );
    return result;
}

static std::string strip_trailing_commas( const std::string &input )
{
    std::string output;
    output.reserve( input.size() );

    bool in_string = false;
    bool escaped = false;
    for( std::size_t i = 0; i < input.size(); ++i ) {
        const char ch = input[i];
        if( in_string ) {
            output += ch;
            if( escaped ) {
                escaped = false;
            } else if( ch == '\\' ) {
                escaped = true;
            } else if( ch == '"' ) {
                in_string = false;
            }
            continue;
        }

        if( ch == '"' ) {
            in_string = true;
            output += ch;
            continue;
        }

        if( ch == ',' ) {
            std::size_t next = i + 1;
            while( next < input.size() &&
                   ( input[next] == ' ' || input[next] == '\n' || input[next] == '\r' || input[next] == '\t' ) ) {
                ++next;
            }
            if( next < input.size() && ( input[next] == ']' || input[next] == '}' ) ) {
                continue;
            }
        }

        output += ch;
    }

    return output;
}

static void write_array( JsonIn &jsin, JsonOut &jsout, int depth, bool force_wrap )
{
    jsout.start_array( force_wrap );
    jsin.start_array();
    while( !jsin.end_array() ) {
        format( jsin, jsout, depth );
    }
    jsout.end_array();
}

static void write_object( JsonIn &jsin, JsonOut &jsout, int depth, bool force_wrap )
{
    jsout.start_object( force_wrap );
    jsin.start_object();
    while( !jsin.end_object() ) {
        std::string name = jsin.get_member_name();
        jsout.member( name );
        bool override_wrap = false;
        if( name == "rows" || name == "blueprint" ) {
            const int in_start_pos = jsin.tell();
            const bool ate_separator = jsin.get_ate_separator();
            {
                JsonArray arr = jsin.get_array();
                if( arr.size() > 1 ) {
                    override_wrap = true;
                }
            }
            jsin.seek( in_start_pos );
            jsin.set_ate_separator( ate_separator );
        }
        format( jsin, jsout, depth, override_wrap );
    }
    jsout.end_object();
}

static void format_collection( JsonIn &jsin, JsonOut &jsout, int depth,
                               std::function<void( JsonIn &, JsonOut &, int, bool )> write_func,
                               bool force_wrap )
{
    if( depth > 1 && !force_wrap ) {
        const int in_start_pos = jsin.tell();
        const bool ate_separator = jsin.get_ate_separator();
        const int out_start_pos = jsout.tell();
        const bool need_separator = jsout.get_need_separator();
        write_func( jsin, jsout, depth, false );
        if( jsout.tell() - out_start_pos <= 120 ) {
            return;
        }
        jsin.seek( in_start_pos );
        jsin.set_ate_separator( ate_separator );
        jsout.seek( out_start_pos );
        if( need_separator ) {
            jsout.set_need_separator();
        }
    }
    write_func( jsin, jsout, depth, true );
}

static void format( JsonIn &jsin, JsonOut &jsout, int depth, bool force_wrap )
{
    depth++;
    if( jsin.test_array() ) {
        format_collection( jsin, jsout, depth, write_array, force_wrap );
    } else if( jsin.test_object() ) {
        format_collection( jsin, jsout, depth, write_object, force_wrap );
    } else if( jsin.test_string() ) {
        const int start_pos = jsin.tell();
        jsin.get_string();
        const int end_pos = jsin.tell();
        std::string str = jsin.substr( start_pos, end_pos - start_pos );
        str = str.substr( str.find( '"' ) );
        str = str.substr( 0, str.rfind( '"' ) + 1 );
        jsout.write_separator();
        *jsout.get_stream() << str;
        jsout.set_need_separator();
    } else if( jsin.test_number() ) {
        const int start_pos = jsin.tell();
        jsin.skip_number();
        const int end_pos = jsin.tell();
        std::string str_form = jsin.substr( start_pos, end_pos - start_pos );
        jsin.seek( start_pos );
        if( str_form.find( '.' ) == std::string::npos ) {
            if( str_form.find( '-' ) == std::string::npos ) {
                const uint64_t num = jsin.get_uint64();
                jsout.write( num );
            } else {
                const int64_t num = jsin.get_int64();
                jsout.write( num );
            }
        } else {
            const double num = jsin.get_float();
            std::string double_str = std::to_string( num );
            double_str.erase( double_str.find_last_not_of( '0' ) + 1, std::string::npos );
            if( double_str.back() == '.' ) {
                double_str += "0";
            }
            jsout.write_separator();
            *jsout.get_stream() << double_str;
            jsout.set_need_separator();
        }
    } else if( jsin.test_bool() ) {
        jsout.write( jsin.get_bool() );
    } else if( jsin.test_null() ) {
        jsin.skip_null();
        jsout.write_null();
    } else {
        jsin.error( "unrecognized json element" );
    }
}

extern "C" {

EMSCRIPTEN_KEEPALIVE
char *format_json( const char *input )
{
    last_error.clear();
    if( input == nullptr || std::strlen( input ) == 0 ) {
        last_error = "Error, input empty.";
        return nullptr;
    }

    try {
        std::stringstream in( strip_trailing_commas( input ) );
        std::stringstream out;
        JsonIn jsin( in );
        JsonOut jsout( out, true );
        format( jsin, jsout );
        out << '\n';
        return make_c_string( out.str() );
    } catch( const std::exception &err ) {
        last_error = err.what();
        return nullptr;
    } catch( ... ) {
        last_error = "Unknown formatter error.";
        return nullptr;
    }
}

EMSCRIPTEN_KEEPALIVE
const char *get_last_error()
{
    return last_error.c_str();
}

EMSCRIPTEN_KEEPALIVE
void free_string( char *value )
{
    std::free( value );
}

}
